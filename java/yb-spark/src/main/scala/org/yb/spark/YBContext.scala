/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.yb.spark

import org.apache.hadoop.conf.Configuration
import org.apache.hadoop.io.NullWritable
import org.apache.spark.rdd.RDD
import org.apache.spark.SparkContext
import org.yb.annotations.InterfaceStability
import org.yb.client.{AsyncYBClient, YBClient, RowResult}
import org.yb.mapreduce.YBTableInputFormat

/**
  * YBContext is a façade for YB operations.
  *
  * If a YB client connection is needed as part of a Spark application, a
  * [[YBContext]] should used as a broadcast variable in the job in order to
  * share connections among the tasks in a JVM.
  */
@InterfaceStability.Unstable
class YBContext(kuduMaster: String) extends Serializable {
  @transient lazy val syncClient = new YBClient.YBClientBuilder(kuduMaster).build()
  @transient lazy val asyncClient = new AsyncYBClient.AsyncYBClientBuilder(kuduMaster).build()

  /**
    * Create an RDD from a YB table.
    *
    * @param tableName          table to read from
    * @param columnProjection   list of columns to read
    *
    * Not specifying this at all (i.e. setting to null) or setting to the special string
    * '*' means to project all columns.
    * @return a new RDD that maps over the given table for the selected columns
    */
  def kuduRDD(sc: SparkContext,
              tableName: String,
              columnProjection: Seq[String] = Nil): RDD[RowResult] = {

    val conf = new Configuration
    conf.set("kudu.mapreduce.master.address", kuduMaster)
    conf.set("kudu.mapreduce.input.table", tableName)
    if (columnProjection.nonEmpty) {
      conf.set("kudu.mapreduce.column.projection", columnProjection.mkString(","))
    }

    val rdd = sc.newAPIHadoopRDD(conf, classOf[YBTableInputFormat],
                                 classOf[NullWritable], classOf[RowResult])

    val columnNames = if (columnProjection.nonEmpty) columnProjection.mkString(", ") else "(*)"
    rdd.values.setName(s"YBRDD { table=$tableName, columnProjection=$columnNames }")
  }
}
